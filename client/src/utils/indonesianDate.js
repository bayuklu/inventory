export const convertStringCaleToIndonesiaFormat = (str) => {
    //date function
    const date = str.split('/')[1]
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

    return `${__DATE.toString().padStart(2, "0")}, ${MOBTH} ${__YEAR}`
}