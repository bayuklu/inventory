import payment_transaction_id from '../payment/payment.js'
const Month = payment_transaction_id.split("_")[0].split("#")[0]
// console.log(Month)

const cP = () => {
    return new Date().getMonth() + 1 == Month || (new Date().getDate() < 18 && new Date().getMonth() + 1 != Month)
}

export default cP