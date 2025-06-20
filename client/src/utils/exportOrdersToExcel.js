import rupiah from "./rupiah";
import XLSX from "xlsx/dist/xlsx.full.min.js";
import FileSaver from "file-saver";
import { convertStringCaleToIndonesiaFormat } from "./indonesianDate";
import axios from "axios";
import { getCookie, setTagihanNotificationCookieUntilTomorrowStart } from "./cookies";

/**
 * Mengekspor data pesanan dalam format tertentu.
 *
 * @async
 * @function handleExport
 * @param {Object} params - Parameter untuk ekspor data.
 * @param {Array<Object>} params.ordersData - Data pesanan yang akan diekspor.
 * @param {boolean} [params.isBillsData=false] - True jika ingin mencetak data tagihan, dan False jika ingin mencetak data Transaksi.
 * @param {string} [params.formattedDate='6/20/2025'] - formattedDate contoh: 6/12/2025 -> 12 Juni 2025
 * @param {boolean} [params.isUsingMsg=false] - Apakah data yang diekspor menggunakan message handling.
 * @param {Function} [params.setMsg='setMsg'] - setMsg state dari halaman tertentu.
 *
 * @returns {Promise<void>} Tidak mengembalikan apa-apa, tetapi menjalankan proses ekspor asinkron.
 *
 * @example
 * await handleExport({
 *   ordersData: myOrders,
 *   isBillsData: true,
 *   formattedDate: 6/12/2025,
 *   isUsingMsg: true,
 *   setMsg: setMsg,
 * });
 */

export const handleExport = async ({
  ordersData = [],
  isBillsData = false,
  formattedDate,
  isUsingMsg = false,
  setMsg,
}) => {
  console.log("handleExport dipanggil dengan:", {
    ordersData,
    isBillsData,
    formattedDate,
    isUsingMsg,
  });

  try {
    if (ordersData.length < 1) {
      if (isUsingMsg) {
        return setMsg({
          msg: "Gagal Export, Data Kosong!",
          color: "red",
        });
      }
      return false;
    }

    //   let formattedDate = calendarRef.current.querySelector(".flatpickr-input").value;

    if (!formattedDate) {
      const date = new Date();

      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();

      formattedDate = convertStringCaleToIndonesiaFormat(
        `${month}/${day}/${year}`
      );
    } else {
      formattedDate = convertStringCaleToIndonesiaFormat(formattedDate);
    }

    const worksheet1 = XLSX.utils.aoa_to_sheet([]);

    // Baris 1: Tanggal
    XLSX.utils.sheet_add_aoa(
      worksheet1,
      [
        [
          `${
            isBillsData ? "[Tagihan]" : "[Laporan]"
          } Tanggal: ${formattedDate}`,
        ],
      ],
      {
        origin: "B1",
      }
    );

    // Baris 3: Judul Data Penjualan
    XLSX.utils.sheet_add_aoa(worksheet1, [["ANA BASALIM FROZEN"]], {
      origin: "B3",
    });

    // Format data ordersData
    const ordersFormatted = ordersData.map((order, index) => ({
      No: index + 1,
      NAMA: order[2].toUpperCase(),
      S: order[5],
      JUMLAH: rupiah(order[3]),
      "SETOR 1": "",
      "SETOR 2": "",
      "SETOR 3": "",
      "SETOR 4": "",
      KET: order[7],
    }));

    // Tabel penjualan mulai di baris 5
    XLSX.utils.sheet_add_json(worksheet1, ordersFormatted, { origin: "B5" });

    // Kolom
    worksheet1["!cols"] = [
      { wch: 2 }, // Kolom A kosong (jarak)
      { wch: 3 },
      { wch: 20 },
      { wch: 6 },
      { wch: 12 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 5 },
    ];

    // Fungsi menghitung banyak order dan pendapatan
    const HitungBanyakOrderSales = (namaSales) =>
      ordersData.reduce(
        (count, order) => (order[5] === namaSales ? count + 1 : count),
        0
      );

    const hitungJumlahPendapatan = (namaSales) =>
      ordersData.reduce((total, order) => {
        if (order[5] === namaSales) {
          const jumlah = Number(order[3]);
          total += isNaN(jumlah) ? 0 : jumlah;
        }
        return total;
      }, 0);

    // Data Sales
    const newOrdersData = [
      {
        No: "",
        NAMA: "Jumlah Setoran Sales ==>",
        S: "Sales",
        JUMLAH: "Jumlah Order",
        "SETOR 1": "Jumlah Uang",
        "SETOR 2": "",
        "SETOR 3": "",
        "SETOR 4": "",
        KET: "",
      },
      {
        No: "",
        NAMA: "",
        S: "Eja",
        JUMLAH: HitungBanyakOrderSales("Eja"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Eja")),
      },
      {
        No: "",
        NAMA: "",
        S: "Uyung",
        JUMLAH: HitungBanyakOrderSales("Uyung"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Uyung")),
      },
      {
        No: "",
        NAMA: "",
        S: "Eva",
        JUMLAH: HitungBanyakOrderSales("Eva"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Eva")),
      },
      {
        No: "",
        NAMA: "",
        S: "Dwik",
        JUMLAH: HitungBanyakOrderSales("Dwik"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Dwik")),
      },
      {
        No: "",
        NAMA: "",
        S: "Eman",
        JUMLAH: HitungBanyakOrderSales("Eman"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Eman")),
      },
      {
        No: "",
        NAMA: "",
        S: "Ana",
        JUMLAH: HitungBanyakOrderSales("Ana"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Ana")),
      },
      {
        No: "",
        NAMA: "",
        S: "Dian",
        JUMLAH: HitungBanyakOrderSales("Dian"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Dian")),
      },
      {
        No: "",
        NAMA: "",
        S: "Eyung",
        JUMLAH: HitungBanyakOrderSales("Eyung"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Eyung")),
      },
    ];

    // Baris awal tabel sales = 5 (start table) + ordersData.length (jumlah data) + 2 (judul sales + spasi)
    const startRowForSales = 5 + ordersFormatted.length + 2;

    // Judul Data Sales
    XLSX.utils.sheet_add_aoa(worksheet1, [["Data Sales"]], {
      origin: `B${startRowForSales}`,
    });

    // Tabel sales dimulai 1 baris setelah judul
    XLSX.utils.sheet_add_json(worksheet1, newOrdersData, {
      skipHeader: true,
      origin: `B${startRowForSales + 1}`,
    });

    // Buat dan simpan file Excel
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, worksheet1, "Data Laporan");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const excelBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    if(!getCookie("TodayBillsExported")) {
      setTagihanNotificationCookieUntilTomorrowStart("TodayBillsExported", "1")
    }

    
    if (isUsingMsg && typeof setMsg === "function") {
      setMsg({
        msg: "Berhasil Export Data dan Backup!",
        color: "green",
      });
    }

    const timeNow = new Date()
      .toLocaleTimeString("id-ID")
      .replace(/[:.]/g, "-");
    FileSaver.saveAs(
      excelBlob,
      `${isBillsData ? "Tagihan" : "Laporan"} ${formattedDate} ${timeNow}.xlsx`
    );

    const url = window.URL.createObjectURL(excelBlob);
    const a = document.createElement("a");
    a.href = url;

    if(!isBillsData) {
      const response = await axios.post(
        `${import.meta.env.VITE_BASEURL}/dashboard/orders/backup`
      );
    }
    
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    

  } catch (error) {
    console.error(error);
  }
};
