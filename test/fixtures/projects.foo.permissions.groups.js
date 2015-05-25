module.exports = {
    size: 3,
    limit: 25,
    isLastPage: true,
    values: [
        {
            group: {
                name: "team/js"
            },
            permission: "PROJECT_WRITE"
        },
        {
            group: {
                name: "team/leaders"
            },
            permission: "PROJECT_WRITE"
        },
        {
            group: {
                name: "team/managers"
            },
            permission: "PROJECT_READ"
        }
    ],
    start: 0
};
