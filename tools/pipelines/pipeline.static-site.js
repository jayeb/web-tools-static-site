var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    through = require('through2'),
    Vinyl = require('vinyl');

module.exports = function setupNunjucksPagesPipeline(gulp) {
  var PAGE_OPTIONS = {
    data: _.isObject,
    template: _.isString,
    routes: _.isArray,
    filename: _.isString
  };

  return function nunjucksPagesPipeline(options) {
    var pageList = [],
        templates,
        siteData;

    options = _.defaults({}, options, {
      templates: 'templates',
      siteData: 'sitedata',
      routeMap: './routes.json'
    });

    // Attempt to get usable templates
    if (_.isFunction(options.templates)) {
      templates = options.templates(gulp);
    } else {
      templates = _.get(gulp, options.templates, {});
    }

    // Attempt to get usable siteData
    if (_.isFunction(options.siteData)) {
      siteData = options.siteData(gulp);
    } else {
      siteData = _.get(gulp, options.siteData);
    }

    return through.obj(
      function transform(file, encoding, callback) {
          var stream = this,
              pagesConfig;

          // Make sure the config isn't in the cache;
          delete require.cache[require.resolve(file.path)]
          pagesConfig = require(file.path) || {};

          // Build a data structure from the given pages
          _.each(pagesConfig, function getIndividualPagesByType(pageTypeOptions, pageType) {
            var pagesData = pageTypeOptions.data;

            if (_.isFunction(pagesData)) {
              pagesData = pagesData(siteData || {});
            }

            pagesData = _.castArray(pagesData);

            _.each(pagesData, function renderPage(pageData) {
              pageList.push(_.mapValues(PAGE_OPTIONS, function setKey(typeChecker, key) {
                var value = (key === 'data') ? pageData : pageTypeOptions[key];

                if (_.isFunction(value)) {
                  value = value(pageData);
                }

                return typeChecker(value) ? value : null;
              }));
            });
          });

          callback();
        },
      function flush(callback) {
          var stream = this,
              routeMap = {};

          _.each(pageList, function renderAndMapRoutes(pageOptions) {
            var template,
                renderedPage;

            // Find a template for this page
            template = _.get(templates, pageOptions.template);

            if (!_.isFunction(_.get(template, 'render'))) {
              console.error('Template does not exist:', pageOptions.template);
              return;
            }

            // Render and push to stream
            renderedPage = template.render(pageOptions.data);

            if (_.isNull(renderedPage)) {
              console.error('Error rendering template:', pageOptions.template);
              return;
            }

            stream.push(new Vinyl({
              path: pageOptions.filename,
              contents: new Buffer(renderedPage)
            }));

            // Make routeMap
            _.each(pageOptions.routes, function mapRoute(route) {
              routeMap[route] = pageOptions.filename;
            });
          });

          if (_.isString(options.routeMap)) {
            fs.writeFileSync(options.routeMap, JSON.stringify(routeMap, null, 2));
          }

          callback();
        }
    );
  };
};
