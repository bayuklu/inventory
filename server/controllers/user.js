import Users from "../model/userModel.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const Login = async(req, res) => {
    if(!req.body.username || !req.body.password) return res.status(400).json({msg: "Masukkan username atau password terlebih dahulu!"})
    try {
        const user = await Users.findOne({where : {username: req.body.username}})
        if(!user) return res.status(403).json({msg: "Username tidak ditemukan!!"})

        const result = await bcrypt.compare(req.body.password, user.password)
        if(!result) return res.status(400).json({msg : "Password salah!"})
        
        const userID = user.id, 
        username = user.username, 
        role = user.role

        const accessToken = jwt.sign({userID, username, role}, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn : "20s"
        })
        const refreshToken = jwt.sign({userID, username, role}, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn : "1d"
        })

        await Users.update({refreshToken: refreshToken}, {where: {id: userID}})
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // Pastikan ini sesuai dengan pengaturan HTTPS
            sameSite: 'none',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000, // Masa berlaku cookie (1 hari)
        });
        res.json({accessToken})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error!"})
    }
}

export const Logout = async(req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        return res.status(401).json({ msg: "No refresh token provided", token: refreshToken });
    }

    try {
        const user = await Users.findOne({ where: { refreshToken: refreshToken } });
        if (!user) return res.status(204)
        // console.log(user)

        const userID = user.id;
        await Users.update({ refreshToken: null }, { where: { id: userID } });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        }).status(200).json({ msg: "Logout successful!" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Internal server error!" });
    }
}


export const isUserLoggedIn = async(req, res) => {
    const {refreshToken} = req.cookies
    if(refreshToken == undefined) return res.sendStatus(403)
    try {
        const user = await Users.findOne({
            where: {refreshToken : refreshToken}
        })
        if(!user) return res.status(403).json({msg: "User not found"})
        res.sendStatus(200)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({msg: "Internal server error!"})
    }
}





// MANUAL REGIST
export const Register = async(req, res) => {
    console.log(req.headers)
    const {firstName, lastName, password, confPassword} = req.body
    if(!firstName, !lastName, !password, !confPassword) return res.status(400).json({msg: "All field are required"})
    if(password !== confPassword) return res.status(400).json({msg: "Password and confirm password must be match!"})

    try {
        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password, salt)

        await Users.create({
            username: `${firstName}${lastName}`,
            password: hashPassword,
            role: 'kasir'
        })
        res.status(200).json({msg: "Register Successfully!"})
    } catch (error) { 
        console.log(error)
        res.status(500).json({msg: "Internal server error!"})
    }
}