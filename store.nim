import norm/sqlite, times, strutils, webConfig, json, os


type
    PostType = enum
        ptGeneric = 0,
        ptChoreDone = 1,

db(DB_FILE, "", "", ""):
    type 
        Chore* = object
            description*: string
            featured_picture_id*: int64
            schedule_id*: int64

        User* = object
            username*: string
            pushover_token*: string
            pwHash: seq[byte]
            lastOnline: times.Time

        Session* = object
            userId*: int64
            randVal*: string
            validTime*: times.Time

        Post* = object
            chore_id*: int64
            content*: string
            time*: times.Time
            postType: PostType

        Picture* = object
            name*: string
            path*: string

        ChoreSchedule* = object
            minDays*: float
            maxDays*: float

        Reminder* = object
            reminderTime*: times.Time
            reminderText*: string

    proc setup*() =
        if not existsDir("uploadedPhotos"):
            createDir("uploadedPhotos")
        #[
        withDb:
            createTables(force=true)
        ]#
        discard

    proc declareSchedule*(minDays: float, maxDays: float): int64 =
        withDb:
            try:
                var sched = ChoreSchedule.getOne(
                    cond= "ABS(MinDays - ?) < 0.001 AND ABS(MaxDays - ?) < 0.001",
                    params=[?minDays, ?maxDays] )
                echo "found"
                return sched.id
            except KeyError:
                echo "not found"
                return (ChoreSchedule(
                    minDays: minDays,
                    maxDays: maxDays,
                )).insertId()


when isMainModule:
    withDb:
        setup()
        echo declareSchedule(5.0, 10.0)
        echo declareSchedule(3.0, 4.0)
        echo declareSchedule(5.0, 7.0)
        echo declareSchedule(5.0, 10.0)
        echo declareSchedule(5.0, 10.0)

        parseJson(""" {"description": "foo" } """).to(Chore).echo



    
