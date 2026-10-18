const CHUC_VU = require("./CHUC_VU.model");
const NHAN_VIEN = require("./NHAN_VIEN.model");
const KHACH_HANG = require("./KHACH_HANG.model");
const GIONG = require("./GIONG.model");
const THU_NUOI = require("./THU_NUOI.model");
const PHONG_LUU_TRU = require("./PHONG_LUU_TRU.model");
const SD_PHONG_LUU_TRU = require("./SD_PHONG_LUU_TRU.model");
const DICH_VU = require("./DICH_VU.model");
const SD_DICH_VU = require("./SD_DICH_VU.model");
const HOA_DON = require("./HOA_DON.model");

module.exports.initTables = async () => {
  try {
    await CHUC_VU.CHUC_VU();
    await NHAN_VIEN.NHAN_VIEN();
    await KHACH_HANG.KHACH_HANG();
    await GIONG.GIONG();
    await THU_NUOI.THU_NUOI();
    await PHONG_LUU_TRU.PHONG_LUU_TRU();
    await SD_PHONG_LUU_TRU.SD_PHONG_LUU_TRU();
    await DICH_VU.DICH_VU();
    await SD_DICH_VU.SD_DICH_VU();
    await HOA_DON.HOA_DON();
    console.log("initTables success");
  } catch (error) {
    console.error("error", error.message);
  }
};
