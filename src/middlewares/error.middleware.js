function errorMiddleware(error, req, res, next) {
  console.error(error);

  const status = error.status || 500;
  const message = status === 500 ? 'Terjadi kesalahan pada server.' : error.message;

  res.status(status).render('pages/error', {
    title: 'Error',
    active: '',
    message,
    error: process.env.NODE_ENV === 'production' ? null : error,
    categories: []
  });
}

module.exports = errorMiddleware;
