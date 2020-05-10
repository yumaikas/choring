import strutils, json
import jester, ws, ws/jester_extra
import viewbase, webConfig, store
import norm/sqlite

from nativesockets import Port

var bindAddr = "localhost"

if not BIND_LOCAL_ONLY:
    bindAddr = "0.0.0.0"

proc init() =
    setup()

init()

settings:
    port = nativesockets.Port(webConfig.PORT)
    bindAddr = bindAddr
    staticDir = "./static"

routes: 
    #TODO: Come back to this, broadcast events later
    #[
    get "/ws":
        var ws = await newWebSocket(request)
        await ws.send("Welcome to simple echo server")
        while ws.readyState == Open:
            let packet = await ws.receiveStrPacket()
            await ws.send(packet)
    ]#
    get "/":
        resp pageBase("""
        <div id="app"></div>
        <script src="/app.js"></script>
        """)

    get "/chores":
        withDb:
            resp(Http200, $(%*(Chore.getAll())), contenttype="application/json")

    post "/schedule/declare/@minDays/@maxDays":
        let schedId = declareSchedule((@"minDays").parseFloat(), (@"maxDays").parseFloat())
        resp $schedId

    post "/chores/create":
        withDb:
            let choreJson = parseJson(request.body)
            assert choreJson.hasKey("name"), "A description is required for a chore!"
            assert choreJson.hasKey("minDays"), "A chore needs a minimum number of days"
            assert choreJson.hasKey("maxDays"), "A chore needs a maximum number days"

            let name = choreJson["name"].getStr("")
            # TODO: Figure out why these aren't getting saved correctly
            let minDays = choreJson["minDays"].getFloat(0.0)
            let maxDays = choreJson["maxDays"].getFloat(0.0)

            let sched_id = declareSchedule(minDays, maxDays)

            resp $(Chore(
                description: name,
                schedule_id: sched_id,
                featured_picture_id: -1
            ).insertID())



    get "/feed":
        resp ""

    get "/posts":
        resp ""

    get "/agenda":
        resp ""

    post "/plants/edit/@id":
        resp ""

    post "/plants/activity/@id":
        resp ""


    post "/posts/create":
        resp ""

    post "/login":
        resp ""