import strutils, json, times, tables, oids, os, sets
import jester, ws, ws/jester_extra
import viewbase, webConfig, store
import norm/sqlite

from nativesockets import Port

var bindAddr = "localhost"

if not BIND_LOCAL_ONLY:
    bindAddr = "0.0.0.0"

type ChoreDTO* = object
    id*: int
    description*: string
    minDays*: float
    maxDays*: float
    lastPerformed*: int
    pictureId*: int

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
            let chores = Chore.getAll()
            let db_schedules = ChoreSchedule.getAll()

            var schedules = newTable[int64, ChoreSchedule]()
            for s in db_schedules:
                schedules[s.id] = s

            var output = newSeq[ChoreDTO]()

            for c in chores:
                var sc = schedules[c.schedule_id]
                output.add(ChoreDTO(
                    id: c.id,
                    description: c.description,
                    minDays: sc.minDays,
                    maxDays: sc.maxDays,
                    lastPerformed: 0,
                    pictureId: int(c.featured_picture_id),
                ))

            resp(Http200, $(%*(output)), contenttype="application/json")

    post "/schedule/declare/@minDays/@maxDays":
        let schedId = declareSchedule((@"minDays").parseFloat(), (@"maxDays").parseFloat())
        resp $schedId
    get "/picture/@id":
        let id: int = (@"id").parseInt()
        withDb:
            try: 
                let p = Picture.getOne(id)
                sendFile(joinPath("uploadedPhotos", p.name))
            except KeyError:
                resp(Http404, "Picture not found!")
    post "/picture/upload":
        let name = request.formData["file"].fields["filename"]
        var (_, _, ext) = splitFile(name)
        assert ext in toHashSet([".jpg", ".jpeg", ".png", ".bmp", ".gif"]), "File needs to be an image file"
        let imageData = request.formData["file"].body
        let saveName = $(genOid()) & ext
        writeFile(joinPath("uploadedPhotos", saveName), imageData)
        withDb:
            let id = Picture(
                name: saveName,
                path: "/picture/" & saveName,
            ).insertID()
            resp(Http200, $id)

    post "/chores/create":
        withDb:
            let choreJson = parseJson(request.body)
            assert choreJson.hasKey("name"), "A description is required for a chore!"
            assert choreJson.hasKey("minDays"), "A chore needs a minimum number of days"
            assert choreJson.hasKey("maxDays"), "A chore needs a maximum number days"

            let pictureId = choreJson{"pictureId"}.getInt(-1)

            let name = choreJson["name"].getStr("")
            # TODO: Figure out why these aren't getting saved correctly
            let minDays = choreJson["minDays"].getFloat(0.0)
            let maxDays = choreJson["maxDays"].getFloat(0.0)

            let sched_id = declareSchedule(minDays, maxDays)

            resp $(Chore(
                description: name,
                schedule_id: sched_id,
                featured_picture_id: pictureId,
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