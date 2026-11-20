/**
 * Zero-Dependency GitHub Direct Uploader
 * 
 * Creates a repository on GitHub and uploads all files via the GitHub REST/Git Data API.
 * Requires: GITHUB_TOKEN (Personal Access Token with 'repo' scope)
 * 
 * Usage:
 *   node scripts/github_push.js YOUR_GITHUB_TOKEN [repo-name]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const token = process.argv[2] || process.env.GITHUB_TOKEN;
const repoName = process.argv[3] || 'viral-clips-ai';

if (!token) {
  console.error('❌ Error: GitHub Personal Access Token is required.');
  console.log('Usage: node scripts/github_push.js <YOUR_GITHUB_TOKEN> [repo_name]');
  process.exit(1);
}

function githubRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`);
    const headers = {
      'User-Agent': 'ViralClips-AI-Uploader',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    };

    let body = null;
    if (data) {
      body = JSON.stringify(data);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => { responseBody += chunk; });
      res.on('end', () => {
        try {
          const parsed = responseBody ? JSON.parse(responseBody) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject({ statusCode: res.statusCode, body: parsed });
          }
        } catch (e) {
          resolve(responseBody);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function getAllFiles(dir, base = '') {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    if (file === 'node_modules' || file === '.git' || file === '.env') continue;
    const fullPath = path.join(dir, file);
    const relPath = path.join(base, file).replace(/\\/g, '/');
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file === 'clips') {
        // Keep clips directory with .gitkeep
        results.push({ relPath: 'clips/.gitkeep', fullPath: path.join(fullPath, '.gitkeep') });
      } else {
        results = results.concat(getAllFiles(fullPath, relPath));
      }
    } else {
      if (!file.endsWith('.mp4') && !file.endsWith('.webm') && !file.endsWith('.log')) {
        results.push({ relPath, fullPath });
      }
    }
  }
  return results;
}

async function run() {
  try {
    console.log('🔑 Authenticating with GitHub API...');
    const user = await githubRequest('/user');
    const username = user.login;
    console.log(`✅ Authenticated as: ${username} (${user.name || username})`);

    // 1. Create or get repository
    console.log(`📦 Checking repository "${repoName}"...`);
    let repo;
    try {
      repo = await githubRequest(`/repos/${username}/${repoName}`);
      console.log(`ℹ️ Repository already exists: ${repo.html_url}`);
    } catch (e) {
      if (e.statusCode === 404) {
        console.log(`🚀 Creating new repository "${repoName}"...`);
        repo = await githubRequest('/user/repos', 'POST', {
          name: repoName,
          description: 'AI-powered viral short video editor from video links with 9:16 vertical layout and karaoke subtitles.',
          private: false,
          auto_init: true
        });
        console.log(`✅ Repository created: ${repo.html_url}`);
        // Give GitHub a moment to initialize the default branch
        await new Promise(r => setTimeout(r, 2000));
      } else {
        throw e;
      }
    }

    // 2. Collect local files
    const files = getAllFiles(ROOT_DIR);
    console.log(`📄 Found ${files.length} project files to push.`);

    // 3. Create Git Blobs
    console.log('📤 Uploading file blobs...');
    const treeItems = [];

    for (const f of files) {
      if (!fs.existsSync(f.fullPath)) continue;
      const content = fs.readFileSync(f.fullPath);
      const isBinary = f.fullPath.match(/\.(png|jpg|jpeg|gif|ico|webp)$/i);

      const blobRes = await githubRequest(`/repos/${username}/${repoName}/git/blobs`, 'POST', {
        content: content.toString(isBinary ? 'base64' : 'utf8'),
        encoding: isBinary ? 'base64' : 'utf-8'
      });

      treeItems.push({
        path: f.relPath,
        mode: '100644',
        type: 'blob',
        sha: blobRes.sha
      });
      process.stdout.write('.');
    }
    console.log('\n✅ All file blobs created.');

    // 4. Get default branch commit
    let parentSha = null;
    let baseTreeSha = null;
    try {
      const ref = await githubRequest(`/repos/${username}/${repoName}/git/refs/heads/main`);
      parentSha = ref.object.sha;
      const commit = await githubRequest(`/repos/${username}/${repoName}/git/commits/${parentSha}`);
      baseTreeSha = commit.tree.sha;
    } catch (e) {
      // If branch is master instead of main
      try {
        const refMaster = await githubRequest(`/repos/${username}/${repoName}/git/refs/heads/master`);
        parentSha = refMaster.object.sha;
        const commit = await githubRequest(`/repos/${username}/${repoName}/git/commits/${parentSha}`);
        baseTreeSha = commit.tree.sha;
      } catch (err) {}
    }

    // 5. Create Tree
    console.log('🌲 Constructing Git commit tree...');
    const treeData = { tree: treeItems };
    if (baseTreeSha) treeData.base_tree = baseTreeSha;

    const newTree = await githubRequest(`/repos/${username}/${repoName}/git/trees`, 'POST', treeData);

    // 6. Create Commit
    console.log('✍️ Creating commit...');
    const commitData = {
      message: 'Publish ViralClips.AI - 9:16 Viral Shorts Generator & Studio',
      tree: newTree.sha,
      parents: parentSha ? [parentSha] : []
    };
    const newCommit = await githubRequest(`/repos/${username}/${repoName}/git/commits`, 'POST', commitData);

    // 7. Update Ref
    console.log('🎯 Updating branch reference...');
    try {
      await githubRequest(`/repos/${username}/${repoName}/git/refs/heads/main`, 'PATCH', {
        sha: newCommit.sha,
        force: true
      });
    } catch (e) {
      await githubRequest(`/repos/${username}/${repoName}/git/refs`, 'POST', {
        ref: 'refs/heads/main',
        sha: newCommit.sha
      });
    }

    console.log('\n=============================================================');
    console.log('🎉 SUCCESS! YOUR PROJECT IS LIVE ON GITHUB:');
    console.log(`👉 https://github.com/${username}/${repoName}`);
    console.log('=============================================================\n');

  } catch (err) {
    console.error('❌ Failed to push to GitHub:', err.body || err);
  }
}

run();
