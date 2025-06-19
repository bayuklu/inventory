export const convertStringCaleToIndonesiaFormat = (str) => {

    //date function
    const date = str.split('/')[1]
    // console.log(new Date(new Date().setDate(date)))
    const __DATE = Number(date)
    //end date function

    //month function
    const convertStrToIndonesia = (str) => {
        let fixedMonthNumber
        const monthIndex = str.split('')

        monthIndex.length > 1 && monthIndex[0] === "0"
        ?   fixedMonthNumber = monthIndex[1]
        :   fixedMonthNumber = monthIndex.join('')

        const INDONESIAN_MONTH = 
        {
            1: "Januari",
            2: "Februari",
            3: "Maret",
            4: "April",
            5: "Mei",
            6: "Juni",
            7: "Juli",
            8: "Agustus",
            9: "September",
            10: "Oktober",
            11: "November",
            12: "Desember",
        }

        return INDONESIAN_MONTH[Number(fixedMonthNumber)]
    }
    const month = str.split('/')[0]
    const MOBTH = convertStrToIndonesia(month)
    //end month function

    //years function
    const __YEAR = Number(str.split("/")[2])
    //end years function

    //days function
    
    //end days function

    return `${__DATE.toString().padStart(2, "0")} ${MOBTH} ${__YEAR}`
}

export const parseIndonesianDate = (str) => {
    const bulanMap = {
        "Januari": 0,
        "Februari": 1,
        "Maret": 2,
        "April": 3,
        "Mei": 4,
        "Juni": 5,
        "Juli": 6,
        "Agustus": 7,
        "September": 8,
        "Oktober": 9,
        "November": 10,
        "Desember": 11
    };

    const [tanggalStr, bulanStr, tahunStr] = str.split(" ");
    const tanggal = parseInt(tanggalStr);
    const bulan = bulanMap[bulanStr];
    const tahun = parseInt(tahunStr);

    if (bulan === undefined || isNaN(tanggal) || isNaN(tahun)) {
        throw new Error("Format tanggal tidak valid: " + str);
    }

    return new Date(tahun, bulan, tanggal);
};

export const getIndonesianDay = (day) => {
    const dayInIndo = {
        0: "Minggu",
        1: "Senin",
        2: "Selasa",
        3: "Rabu",
        4: "Kamis",
        5: "Jumat",
        6: "Sabtu",
    }

    return dayInIndo[day]
}