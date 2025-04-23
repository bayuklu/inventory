const protectOrigin = (req, res, next) => {
    const allowerOrigin = ['https://abfrozen.vercel.app']
    const ip = req.headers['x-vercel-forwarded-for']
    if(allowerOrigin.includes(ip)) {
        next()
    } else {
        return res.status(403).json({error: "Forbidden"})
    }
}

export default protectOrigin