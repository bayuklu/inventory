import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const convertToWita = (date) => {
    return dayjs.utc(date).tz(`Asia/Makassar`).format(`YYYY-MM-DD HH:mm:ss`)
}

export const TODAY_START = dayjs().tz('Asia/Makassar').startOf('day').utc().toDate()