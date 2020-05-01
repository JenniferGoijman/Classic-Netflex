const {
    User,
    Token
} = require('../models/index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = process.env.NODE_ENV || 'development';
const {
    jwt_secret,
    API_URL,
    FRONT_URL
} = require('../config/config.json')[env];
const transporter = require('../config/nodemailer');
const UserController = {
    getAll(req, res) {
        User.findAll({
            })
            .then(users => res.send(users))
    },
    async register(req, res) {
        try {
            const password = await bcrypt.hash(req.body.password, 9);
            const email = req.body.email

            const emailToken = jwt.sign({
                email
            }, jwt_secret, {
                expiresIn: '48h'
            });
            console.log(API_URL);
            const url = API_URL + 'users/confirmed/' + emailToken;
            await transporter.sendMail({
                to: email,
                subject: 'Confirme su registro en Classic Netflex',
                html: `
                <h3>Bienvenido/a ${req.body.name} ${req.body.surname} a Classic Netflex!</h3>
                <h2>Estás a un paso de registrarte</h2>
                <a href="${url}">Click aquí para confirmar tu registro</a>
                Este enlace caduca en 48 horas.
                `
            });
            const user = await User.create({
                name: req.body.name,
                surname: req.body.surname,
                email,
                password,
                confirmed: false,
                role: 'customer'
            });
            res.status(201).send({
                user,
                message: 'Te hemos enviado un email para confirmar el registro'
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                message: 'Hubo un problema al tratar de crear el usuario'
            });
        }
    },
    async confirm(req, res) {
        try {
            const emailToken = req.params.emailToken;
            const payload = jwt.verify(emailToken, jwt_secret);
            const email = payload.email;
            console.log("Console:", emailToken, payload, email)
            await User.update({
                confirmed: true
            }, {
                where: {
                    email
                }
            });
            const user = await User.findOne({
                where: {
                    email
                }
            });
            const authToken = jwt.sign({
                id: user.id
            }, jwt_secret);
            await Token.create({
                token: authToken,
                UserId: user.id
            });
            res.redirect(FRONT_URL+'/user/confirmed/' + authToken);

        } catch (error) {
            console.error(error)
            res.status(500).send({
                message: 'Ha habido un problema al confirmar el usuario',
                error
            })
        }
    },
    async login(req, res) {
        try {
            const user = await User.findOne({
                where: {
                    email: req.body.email
                }
            })
            if (!user) {
                return res.status(400).send({
                    message: 'Email o contraseña incorrectas'
                })
            }
            if (!user.confirmed) {
                return res.status(400).send({
                    message: 'Debes confirmar tu email'
                })
            }
            const isMatch = await bcrypt.compare(req.body.password, user.password);
            if (!isMatch) {
                return res.status(400).send({
                    message: 'Email o contraseña incorrectas'
                })
            }
            const token = jwt.sign({
                id: user.id
            }, jwt_secret);
            Token.create({
                token,
                UserId: user.id
            });
            //status es 200 by default
            res.send({
                message: 'Bienvenid@ ' + user.name + ' ' + user.surname,
                user,
                token
            })
        } catch (error) {
            console.log(error);
            res.status(500).send({
                message: 'Hubo un problema al tratar de logearnos'
            });
        }
    },
    getInfo(req, res) {
        res.send(req.user);
    }
}
module.exports = UserController;