# web-tools-static-site

**web-tools-static-site** is a plugin intended for projects using the [Web-tools](https://github.com/imgix/web-tools) build system. This plugin includes a pipeline that reads in a configuration file (see `examples/`), a set of compiled templates (such as those generated by [web-tools-nunjucks](https://github.com/jayeb/web-tools-nunjucks)), and a datastore (such as that managed by [web-tools-ds](https://github.com/jayeb/web-tools-ds) and outputs a complete set of ready-to-serve flat HTML files, as well as a `routes.json` file. These files can be used by the included server to