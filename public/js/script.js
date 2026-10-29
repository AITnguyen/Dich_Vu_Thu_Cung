// ==========================================
// 1. SHOW ALERT (Tự động ẩn thông báo)
// ==========================================
const showAlert = document.querySelector("[show-alert]");
if (showAlert) {
  const time = parseInt(showAlert.getAttribute("data-time"));
  setTimeout(() => {
    showAlert.classList.add("hidden");
  }, time);
}

// ==========================================
// 2. PREVIEW IMAGE (Xem trước ảnh khi tải lên)
// ==========================================
const previewImage = document.querySelector("[preview-image]");
if (previewImage) {
  const preview = document.querySelector("[preview]");

  previewImage.addEventListener("change", () => {
    const [file] = previewImage.files;
    if (file) {
      preview.classList.remove("hidden");
      preview.src = URL.createObjectURL(file);
    }
  });
}

// ==========================================
// 3. FORMAT PRICE (Định dạng giá tiền VND/USD)
// ==========================================
const formatPrice = document.querySelectorAll(".format-price");
if (formatPrice) {
  formatPrice.forEach((item) => {
    const priceNew = new Intl.NumberFormat("en-US").format(item.innerHTML);
    item.innerHTML = priceNew;
  });
}

// ==========================================
// 4. PAGINATION (Phân trang)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // PAGINATION (Phân trang)
  // ==========================================
  const pagination = document.querySelector("[pagination]");
  if (pagination) {
    let url = new URL(window.location.href);
    const pageButtons = pagination.querySelectorAll("[page]");

    pageButtons.forEach((item) => {
      item.addEventListener("click", () => {
        const value = item.getAttribute("page");
        if (value) {
          url.searchParams.set("page", value);
        } else {
          url.searchParams.delete("page");
        }
        window.location.href = url.href;
      });
    });
  }

  // ==========================================
  // 5. FORM SEARCH (Tìm kiếm dịch vụ)
  // ==========================================
  const formSearch = document.querySelector("#form-search");
  if (formSearch) {
    const searchInp = formSearch.querySelector("#search");
    const url = new URL(window.location.href);
    formSearch.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = searchInp.value;
      if (value) url.searchParams.set("search", value);
      else url.searchParams.delete("search");

      window.location.href = url.href;
    });
  }

  // ==========================================
  // 6. FILTER STATUS (Lọc trạng thái dịch vụ thú cưng)
  // ==========================================
  const filterStatus = document.querySelector("#filter-status");
  if (filterStatus) {
    filterStatus.addEventListener("change", () => {
      const value = filterStatus.value;
      let url = new URL(window.location.href);

      if (value) {
        url.searchParams.set("status", value);
      } else {
        url.searchParams.delete("status");
      }
      url.searchParams.delete("page"); // Reset về trang 1 khi đổi bộ lọc
      window.location.href = url.href;
    });
  }
});

// ==========================================
// 7. Xac nhan xoa dich vu
// ==========================================
// Xử lý xác nhận xóa dịch vụ bằng SweetAlert2
document.addEventListener("DOMContentLoaded", () => {
  const buttonsDelete = document.querySelectorAll("[button-delete]");

  if (buttonsDelete.length > 0) {
    buttonsDelete.forEach((button) => {
      button.addEventListener("click", () => {
        // Tìm thẻ form chứa nút xóa hiện tại
        const formDelete = button.closest("form");

        if (formDelete) {
          Swal.fire({
            title: "Xóa dịch vụ?",
            text: "Bạn có chắc chắn muốn xóa dịch vụ này không?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Đồng ý",
            cancelButtonText: "Hủy",
          }).then((result) => {
            if (result.isConfirmed) {
              // Gửi form đi khi người dùng nhấn Đồng ý
              formDelete.submit();
            }
          });
        }
      });
    });
  }
});
