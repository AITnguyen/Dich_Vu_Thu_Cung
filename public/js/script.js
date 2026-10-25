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
const pagination = document.querySelector("[pagination]");
if (pagination) {
  let url = new URL(window.location.href);
  const page = pagination.querySelectorAll("[page]");
  page.forEach((item) => {
    item.addEventListener("click", () => {
      const value = item.getAttribute("page");
      if (value) url.searchParams.set("page", value);
      else url.searchParams.delete("page");
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
  let url = new URL(window.location.href);
  filterStatus.addEventListener("change", () => {
    const value = filterStatus.value;
    // Thay vì "housing", ta dùng "status" để lọc trạng thái active/inactive của dịch vụ
    if (value) url.searchParams.set("status", value);
    else url.searchParams.delete("status");

    window.location.href = url.href;
  });
}
