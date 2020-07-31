// Constants
const client_id = '96c6c7728fb3487a8783c06ad14e8f0a';
const app_uri = 'http://mcraealex.github.io/powerhour'; // the uri of the applications
var access_token = null;

/**
 * Checks if an access token has been given
 * Returns an object with the token or false
 */
function user_login_status() {

    const hash = window.location.hash;
    const url_params = new URLSearchParams(hash);

    // if a access token is present the use is logged in
    if (url_params.has('#access_token')) {
        return { logged_in: true, token: url_params.get('#access_token') };
    }
    // if not they haven't been logged in
    return { logged_in: false, token: null };
}

/**
 * Logs the user in
 */
function user_login() {
    // these are the permissions we need
    const scopes = 'user-modify-playback-state user-read-private user-read-email user-read-currently-playing user-read-playback-state';

    const login_url = `https://accounts.spotify.com/authorize?client_id=${client_id}&redirect_uri=${app_uri}&scope=${encodeURIComponent(scopes)}&response_type=token`;

    window.location.replace(login_url);
}

async function get_playlists() {
    return await fetch('https://api.spotify.com/v1/me/playlists', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + access_token,
        },
    }).then(resp =>
        resp.json()
    );
}

function show_playlists(playlists) {
    // go to the list and show each of the playlists
    const powerhour = document.getElementById('powerhour');

    const playlists_node = document.createElement('ul');
    playlists_node.id = 'playlists';

    // Create a list of all the playlists
    playlists.items.forEach(playlist => {
        const playlist_node = document.createElement('li')

        playlist_node.append(document.createTextNode(playlist.name));
        playlist_node.onclick = () => { play_playlist(playlist) };

        playlists_node.append(playlist_node);
    });

    // Attach that list to the powerhour div
    powerhour.append(playlists_node);
}

async function play_playlist(playlist) {
    // stop showing the playlists
    const playlists_node = document.getElementById('playlists');
    playlists_node.parentElement.removeChild(playlists_node);

    // send a request to spotify to start playing the playlist clicked
    await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + access_token,
        },
        body: JSON.stringify({
            context_uri: playlist.uri,
        }),
    });

    // show the player
    show_player(playlist);

    // start a timer or interval timer which skips the song after 1 minute
    start_timer();
}

function start_timer() {
    setTimeout(() =>  {
        next_song();
        start_timer();
        setTimeout(() => update_player(), 60000);
    }, 6000)
}

function next_song() {
    fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + access_token,
        },
    });
}

async function update_player() {
    const powerhour = document.getElementById('powerhour');

    const player = document.getElementById('powerhour_player');
    if (player !== null) {
        player.parentElement.removeChild(player);
    }

    await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + access_token,
        },
    }).then(resp => resp.json())
    .then(track => {
        console.log(track);
        const artist = track.item.artists[0].name;
        const name = track.item.name;
        const art_url = track.item.album.images[0].url;

        const player = document.createElement('div');
        player.id = 'powerhour_player';

        const image = document.createElement('img');
        image.id = 'art_image';
        image.height = 640;
        image.width = 640;
        image.src = art_url;
        player.appendChild(image);

        player.appendChild(document.createTextNode(`Song: ${name} Artist: ${artist}`));

        powerhour.appendChild(player);
    });
}

async function show_player(playlist) {

    // shows the current playlist
    const powerhour = document.getElementById('powerhour');

    const playlist_title = document.createElement('h2');
    playlist_title.append(document.createTextNode(`Playlist: ${playlist.name}`));

    powerhour.appendChild(playlist_title);

    // get the currently playing tracks info and append it
    update_player();

}

async function powerhour() {
    const status = user_login_status();
    access_token = status.token;

    // Make them log in
    if (status.logged_in === false) {
        user_login();
    }

    // get the users playlist
    const playlists = await get_playlists();

    console.log(playlists);
    show_playlists(playlists);
    // get and show the users playlists
}

powerhour();