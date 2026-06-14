const path = require('path');
const express = require('express');
const methodOverride = require('method-override');

const indexRoutes = require('./routes/index.routes');
const imageRoutes = require('./routes/image.routes');
const searchRoutes = require('./routes/search.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const { formatFileSize } = require('./utils/file.util');
const { parseTags } = require('./utils/text.util');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.locals.appName = 'AI Sticker Library';
app.locals.formatFileSize = formatFileSize;
app.locals.parseTags = parseTags;
app.locals.encodeCategory = encodeURIComponent;
app.locals.statusLabel = (status) => {
  const labels = {
    processing: 'Processing',
    ready: 'Ready',
    failed: 'Failed'
  };
  return labels[status] || status || 'Unknown';
};

app.use('/', indexRoutes);
app.use('/', imageRoutes);
app.use('/', searchRoutes);

app.use((req, res) => {
  res.status(404).render('pages/error', {
    title: 'Not Found',
    active: '',
    message: 'Halaman tidak ditemukan.',
    error: null,
    categories: []
  });
});

app.use(errorMiddleware);

module.exports = app;
