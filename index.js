#!/usr/bin/env node

const program = require('commander');
const SitemapGenerator = require('sitemap-generator');
const chalk = require('chalk');

const pkg = require('./package.json');

function sitemapFactory() {
  program
    .version(pkg.version)
    .usage('[options] <url>')
    .option(
      '-f, --filepath <filepath>',
      'path to file including filename',
      'sitemap.xml'
    )
    .option(
      '-m, --max-entries <maxEntries>',
      'limits the maximum number of URLs per sitemap file',
      50000
    )
    .option(
      '-d, --max-depth <maxDepth>',
      'limits the maximum distance from the original request',
      0
    )
    .option('-q, --query', 'consider query string')
    .option('-u, --user-agent <agent>', 'set custom User Agent')
    .option('-v, --verbose', 'print details when crawling')
    .parse(process.argv);

  // display help if no url/filepath provided
  if (program.args.length < 1) {
    program.help();
    process.exit();
  }

  const options = {
    stripQuerystring: !program.query,
    filepath: program.filepath,
    maxEntriesPerFile: program.maxEntries,
    maxDepth: program.maxDepth
  };

  // only pass if set to keep default
  if (program.userAgent) {
    options.userAgent = program.userAgent;
  }

  const generator = SitemapGenerator(program.args[0], options);

  if (program.verbose) {
    let added = 0;
    let ignored = 0;
    let errored = 0;

    // add event listeners to crawler if verbose mode enabled
    generator.on('add', url => {
      added += 1;

      console.log('[', chalk.green('ADD'), ']', chalk.gray(url));
    });

    generator.on('ignore', url => {
      ignored += 1;
      console.log('[', chalk.cyan('IGN'), ']', chalk.gray(url));
    });

    generator.on('error', error => {
      errored += 1;
      console.error(
        '[',
        chalk.red('ERR'),
        ']',
        chalk.gray(error.url, ` (${error.code})`)
      );
    });

    generator.on('done', () => {
      // show stats if dry mode
      if (program.verbose) {
        const message =
          'Added %s pages, ignored %s pages, encountered %s errors.';
        const stats = [chalk.white(message), added, ignored, errored];
        console.log.apply(this, stats);
      }

      process.exit(0);
    });
  }

  generator.start();
}

sitemapFactory();
