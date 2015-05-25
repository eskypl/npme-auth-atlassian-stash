module.exports = {
    size: 3,
    limit: 25,
    isLastPage: true,
    values: [
        {
            user: require('./users.mmorin'),
            permission: "REPO_READ"
        },
        {
            user: require('./users.cconrad'),
            permission: "REPO_ADMIN"
        },
        {
            user: require('./users.fhowell'),
            permission: "REPO_WRITE"
        }
    ],
    start: 0
};
