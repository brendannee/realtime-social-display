module.exports = function(app) {
  // catch 404 errors
  app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    res.status(404);
    res.send({
      message: err.message,
      error: {}
    });
  });

  // catch 401 Unauthorized errors
  app.use(function(err, req, res, next) {
    if (err.status !== 401) return next(err);
    res.status(401);
    res.send({
      message: err.message,
      error: err
    });
  });


  // log all other errors
  app.use(function(err, req, res, next) {
    console.error(err.stack || err);
    next(err);
  });

  // development 500 error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
      res.status(500);
      res.send({
        message: err.message,
        error: err
      });
    });
  }


  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(500);
    res.send({
      message: err.message,
      error: {}
    });
  });
};
