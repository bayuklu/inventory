import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

export const convertToWita = (date) => {
    return dayjs.utc(date).tz(`Asia/Makassar`).format(`YYYY-MM-DD HH:mm:ss`)
}

export const TODAY_START_WITA_CONVERT_UTC = dayjs().tz('Asia/Makassar').startOf('day').utc().toDate()
export const YESTERDAY_START_WITA_CONVERT_UTC = dayjs().tz('Asia/Makassar').subtract(1, 'day').startOf('day').utc().toDate()

export const SEVEN_DAYS_AGO_WITA_CONVERT_UTC = dayjs().tz('Asia/Makassar').subtract(7, 'day').startOf('day').utc().toDate()
export const SIX_DAYS_AGO_WITA_CONVERT_UTC = dayjs().tz('Asia/Makassar').subtract(6, 'day').startOf('day').utc().toDate()