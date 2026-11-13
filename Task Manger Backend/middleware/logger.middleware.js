export default function logger(req, res, next) {
    console.log("LOGGER MIDDLEWARE EXECUTED");

    const startTime = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - startTime;

        console.log({
            requestID: req.id,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: duration
        });
    });

    next();
}