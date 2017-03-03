Date.prototype.toDateInputValue = (function() {
    var local = new Date(this)
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset())
    return local.toJSON().slice(0,10)
})


var db
var toRemove = {}

if (!window.indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.")
}

console.log('starting...')
window.onload = function() {
    document.getElementById('datePicker').value = new Date().toDateInputValue()
    document.getElementById('addNote').onclick = interceptSubmit

    var request = indexedDB.open("MyTestDatabase", 9)
    request.onerror = function(event) {
        alert("Why didn't you allow my web app to use IndexedDB?!")
    }
    request.onsuccess = function(event) {
        db = event.target.result
        db.onerror = function(event) {
            // Generic error handler for all errors targeted at this database's
            // requests!
            alert("Database error: " + event.target.errorCode)
        }
        showNotes()
    }
    request.onupgradeneeded = function(event) {
        db = event.target.result

        // db.deleteObjectStore("notes")

        // Create an objectStore to hold information about our customers. We're
        // going to use "ssn" as our key path because it's guaranteed to be
        // unique - or at least that's what I was told during the kickoff meeting.
        var objectStore = db.createObjectStore("notes",
                                               { keyPath: "id",
                                                 autoIncrement : true })

        // Use transaction oncomplete to make sure the objectStore creation is
        // finished before adding data into it.
        objectStore.transaction.oncomplete = function(event) {
            console.log('created!')
            getAllObjs('notes')
        }
    }
    console.log('Loaded!')
}

function getObjStore(name, mode) {
    return db.transaction(name, mode).objectStore(name)
}

function getAllObjs(name) {
    var notes = []
    return new Promise(function (resolve, reject){
        getObjStore(name, 'readonly').openCursor().onsuccess = function(event) {
            var cursor = event.target.result
            if (cursor) {
                notes.push(cursor.value)
                cursor.continue()
            } else {
                resolve(notes)
            }
        }
    })
}

function addNote(ev) {
    var form = document.forms[0]
    var data = {
        date: form.date.value,
        value: form.value.value,
        description: form.description.value,
    }
    getObjStore('notes', 'readwrite').add(data)
    console.log('saved', data)
    showNotes()
    form.value.value = ''
    form.description.value = ''
    return false
}

function removeNote(id) {
    if (toRemove[id]) {
        getObjStore('notes', 'readwrite').delete(id)
        showNotes()
        toRemove[id] = false
    } else {
        var style = document.getElementById('note'+id).style
        toRemove[id] = true
        style['background-color'] = '#ffa5a5'
        style.opacity = 0.5
        window.setTimeout(function () {
            if (style) {
                style['background-color'] = null
                style.opacity = null
            }
            toRemove[id] = false
        }, 1000)
    }
    return false
}

function renderNotes(notes) {
    var listHtml = ''
    updateExportButton(notes)
    for (var note of notes.reverse()) {
        var switcher = switcher=='odd'?'even':'odd'
        listHtml += `<div id="note${note.id}" class="flex note ${switcher}" onclick=removeNote(${note.id})><div class="note-date">${note.date}</div><div class="note-value">R$${note.value}</div><div class="note-descr">${note.description}</div></div>`
    }
    document.getElementById('notesList').innerHTML = listHtml
}

function updateExportButton(notes) {
    var link = document.getElementById('exporter')
    window.n = notes
    var content = 'date,description,value\n'
    for (var note of notes) {
        content += `${note.date},${note.description},${note.value}\n`
    }
    link.href = window.URL.createObjectURL(new Blob([content], {type: 'text/csv'}))
}

function interceptSubmit() {
    var form = document.forms[0]
    if (!form.value.value) {
        form.value.focus()
    } else if (!form.description.value) {
        form.description.focus()
    } else {
        addNote()
    }
    return false
}

// async function showNotes() {
//     renderNotes(await getAllObjs('notes'))
// }
function showNotes() {
    getAllObjs('notes').then(renderNotes)
}



