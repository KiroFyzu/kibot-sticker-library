document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      const message = form.getAttribute('data-confirm');
      if (message && !window.confirm(message)) {
        event.preventDefault();
      }
    });
  });

  const dropZone = document.querySelector('.drop-zone');
  const fileInput = document.querySelector('.drop-zone input[type="file"]');
  const uploadFeedback = document.querySelector('.upload-feedback');
  const uploadForm = document.querySelector('.upload-form');

  if (dropZone && fileInput) {
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const maxFileSize = 10 * 1024 * 1024;

    const setFeedback = (message, type = 'info') => {
      if (!uploadFeedback) return;
      uploadFeedback.textContent = message;
      uploadFeedback.dataset.type = type;
    };

    const updateSelectedFile = () => {
      const file = fileInput.files && fileInput.files[0];
      dropZone.classList.toggle('has-file', Boolean(file));
      dropZone.style.setProperty('--file-name', `"${file ? file.name : ''}"`);

      if (file) {
        setFeedback(`${file.name} siap diupload.`, 'success');
      }
    };

    const assignFile = (file) => {
      if (!file) return false;

      if (!allowedTypes.has(file.type)) {
        setFeedback('Format harus JPG, JPEG, PNG, atau WEBP.', 'error');
        return false;
      }

      if (file.size > maxFileSize) {
        setFeedback('Ukuran file maksimal 10MB.', 'error');
        return false;
      }

      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInput.files = transfer.files;
      updateSelectedFile();
      return true;
    };

    const getFirstImageFile = (files) => {
      return Array.from(files || []).find((file) => allowedTypes.has(file.type));
    };

    const preventDefaults = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    ['dragenter', 'dragover'].forEach((eventName) => {
      dropZone.addEventListener(eventName, (event) => {
        preventDefaults(event);
        dropZone.classList.add('is-dragging');
        setFeedback('Lepaskan gambar di sini.', 'info');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropZone.addEventListener(eventName, (event) => {
        preventDefaults(event);
        dropZone.classList.remove('is-dragging');
      });
    });

    dropZone.addEventListener('drop', (event) => {
      const file = getFirstImageFile(event.dataTransfer.files);
      if (!assignFile(file)) {
        setFeedback('Tidak ada gambar valid pada file yang dijatuhkan.', 'error');
      }
    });

    dropZone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fileInput.click();
      }
    });

    document.addEventListener('paste', (event) => {
      if (!document.body.contains(dropZone)) return;

      const clipboardItems = event.clipboardData ? Array.from(event.clipboardData.items) : [];
      const imageItem = clipboardItems.find((item) => item.kind === 'file' && allowedTypes.has(item.type));
      if (!imageItem) return;

      const pastedFile = imageItem.getAsFile();
      if (!pastedFile) return;

      const extension = pastedFile.type === 'image/webp' ? 'webp' : pastedFile.type === 'image/jpeg' ? 'jpg' : 'png';
      const namedFile = new File(
        [pastedFile],
        `pasted-image-${Date.now()}.${extension}`,
        { type: pastedFile.type || 'image/png' }
      );

      event.preventDefault();
      assignFile(namedFile);
    });

    fileInput.addEventListener('change', updateSelectedFile);
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', () => {
      const submitButton = uploadForm.querySelector('.upload-submit');
      const label = submitButton ? submitButton.querySelector('.button-label') : null;

      uploadForm.classList.add('is-submitting');

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
      }

      if (label) {
        label.textContent = 'Mengupload dan memproses...';
      }
    });
  }
});
