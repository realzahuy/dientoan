// ============================================
// Utility Functions - Dùng chung cho toàn bộ app
// ============================================

// Hiển thị message (success/error)
function showMessage(elementId, message, type = 'error') {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
  element.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
}

// Xóa message
function clearMessage(elementId) {
  const element = document.getElementById(elementId);
  if (element) element.innerHTML = '';
}

// Download file từ blob
function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Handle API response
async function handleApiResponse(response) {
  if (response.ok) {
    return await response.json();
  } else {
    const data = await response.json();
    throw new Error(data.error || 'Lỗi không xác định');
  }
}

// ============================================
// Tool Encrypt/Decrypt - Dùng chung
// ============================================

// Encrypt file
async function encryptFile(fileInputId, passwordInputId, messageId, formId) {
  const fileInput = document.getElementById(fileInputId);
  const password = document.getElementById(passwordInputId).value;
  
  if (!fileInput.files[0]) {
    showMessage(messageId, 'Vui lòng chọn file', 'error');
    return;
  }
  
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('password', password);
  
  try {
    showMessage(messageId, 'Đang mã hóa...', 'success');
    
    const response = await fetch('/tool/encrypt', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const blob = await response.blob();
      downloadFile(blob, fileInput.files[0].name + '.enc');
      
      showMessage(messageId, 'Mã hóa thành công! File đã được tải xuống.', 'success');
      document.getElementById(formId).reset();
    } else {
      const data = await response.json();
      showMessage(messageId, data.error, 'error');
    }
  } catch (error) {
    showMessage(messageId, 'Lỗi kết nối server', 'error');
  }
}

// Decrypt file
async function decryptFile(fileInputId, passwordInputId, messageId, formId) {
  const fileInput = document.getElementById(fileInputId);
  const password = document.getElementById(passwordInputId).value;
  
  if (!fileInput.files[0]) {
    showMessage(messageId, 'Vui lòng chọn file', 'error');
    return;
  }
  
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('password', password);
  
  try {
    showMessage(messageId, 'Đang giải mã...', 'success');
    
    const response = await fetch('/tool/decrypt', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const blob = await response.blob();
      
      // Lấy tên file (bỏ .enc nếu có)
      let filename = fileInput.files[0].name;
      if (filename.endsWith('.enc')) {
        filename = filename.slice(0, -4);
      }
      
      downloadFile(blob, filename);
      
      showMessage(messageId, 'Giải mã thành công! File đã được tải xuống.', 'success');
      document.getElementById(formId).reset();
    } else {
      const data = await response.json();
      showMessage(messageId, data.error, 'error');
    }
  } catch (error) {
    showMessage(messageId, 'Lỗi kết nối server', 'error');
  }
}

// ============================================
// Dashboard Utilities
// ============================================

// Format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
