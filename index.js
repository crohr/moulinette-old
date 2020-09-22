const { Octokit } = require("@octokit/rest");
const octokit = new Octokit();
const ejs = require('ejs');
const fs = require("fs-extra");
const yaml = require('js-yaml');
const anchor = require("markdown-it-anchor");
const front_matter_regex = /^<!--([\s\S]*)-->/m;
const md = require("markdown-it")({
  html: true,
  xhtmlOut: true,
  typographer: true
}).use(anchor, {
  permalink: true,
  permalinkBefore: true,
  permalinkSymbol: '§'
}).use(require("markdown-it-toc-done-right"));

fs.emptyDirSync('dst');
if (fs.existsSync('assets')) {
  fs.copySync('assets', 'dst/assets');
}

function fetch_issues(repository, callback) {
  octokit.paginate("GET /repos/:owner/:repo/issues", {
    owner: repository.split("/")[0],
    repo: repository.split("/")[1],
    state: "all",
    labels: process.env.MOULINETTE_LABELS
  }).then((issues) => {
    issues.map(callback)
  });
}

fetch_issues(process.env.GITHUB_REPOSITORY, function(issue) {
  let site = {
    title: process.env.MOULINETTE_SITE_TITLE || "Moulinette",
    scheme: process.env.MOULINETTE_SITE_SCHEME || "http",
    repository: process.env.GITHUB_REPOSITORY,
    url: process.env.MOULINETTE_SITE_URL || `https://${site.repository.replace("/", ".github.io/")}`,
    twitter: process.env.MOULINETTE_SITE_TWITTER
  };

  let page = {
    title: issue.title,
    slug: anchor.defaults.slugify(issue.title),
    description: null,
    thumbnail: null,
    template: "post",
    created_at: new Date(issue.created_at),
    updated_at: new Date(issue.updated_at),
    source_url: issue.html_url,
    creator_login: issue.user.login,
    creator_avatar_url: issue.user.avatar_url,
    creator_url: issue.user.html_url,
    comments_count: issue.comments
  };

  let front_matter_matches = front_matter_regex.exec(issue.body);
  if (front_matter_matches) {
    Object.assign(
      page,
      yaml.safeLoad(front_matter_matches[1].replace(/(^-|-$)/gm, ''))
    )
  }
  let content = issue.body.replace(front_matter_regex, "");
  if (page.toc) {
    content = "[toc]\n" + content
  }
  page.content = md.render(content);
  ejs.renderFile(`includes/${page.template}.ejs`, {page: page, site: site}, function(err, str) {
    if (err) {
      console.log(err);
    } else {
      let dstFile = `dst/${page.slug}.html`;
      console.log(`Writing ${dstFile}...`)
      fs.writeFileSync(dstFile, str);
    }
  });
});
