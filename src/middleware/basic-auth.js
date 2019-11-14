const AuthService = require('../auth/auth-service');
const bcrypt = require('bcryptjs');
function requireAuth(req, res, next) {
    let basicToken;
    const authToken = req.get('Authorization') || '';

    if (!authToken.toLowerCase().startsWith('basic ')) {
        return res.status(401).json({error: 'missing basic token'});
    } else {
        basicToken = authToken.slice('basic '.length, authToken.length);
    }


    const [tokenUserName, tokenPassword] = AuthService.parseBasicToken(basicToken);

    if (!tokenUserName || !tokenPassword) {
        return res.status(401).json({error: 'Unauthorized request'});
    }

    AuthService.getUserWithUserName(req.app.get('db'), tokenUserName)
        .then(user => {
            if (!user) {
                res.status(401).json({error: 'Unauthorized request'});
            }
            return bcrypt.compare(tokenPassword, user.password)
                .then(passwordsMatch => {
                    if (!passwordsMatch) {
                        return res.status(401).json({error: 'Unauthorized request'})
                    }

                    req.user = user
                    next()
                })
        })
        .catch(next);
}


module.exports = {requireAuth};