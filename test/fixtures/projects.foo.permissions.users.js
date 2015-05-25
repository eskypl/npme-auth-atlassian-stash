module.exports = {
    size: 1,
    limit: 25,
    isLastPage: true,
    values: [
        {
            user: require('./users.cconrad'),
            permission: "PROJECT_ADMIN"
        }
    ],
    start: 0
};
