/*
    Instagram Wannabe Celebs Unfollower
    Copyright (C) 2021 Jawad Dergham
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

//Date Created: 11/2/2021 10:08PM - 11/3/2021 7:19PM
//A script that will find which users you're following that arent following you back and unfollow them.

//You can change to whatever count you want the minimum followers to be.
var FollowerCount = 10000;

// From StackOverflow
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function minutesToMilliseconds(minutes) {
    return (minutes * 60000);
}

async function webReq(url, post) {
    let data;

    try {
        const response = await fetch(url, {
            "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "sec-ch-ua": "\"Google Chrome\";v=\"95\", \"Chromium\";v=\"95\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "x-asbd-id": "198387",
            "x-csrftoken": getCookie("csrftoken"),
            "x-ig-app-id": "936619743392459",
            "x-ig-www-claim": "hmac.AR3EpWdeQ8EKsT2EKxCGC6nCYkDo-dqyQU4Pqyp9b0w5Hazb",
            "x-instagram-ajax": "74408599c4ff",
            "x-requested-with": "XMLHttpRequest"
            },
            "referrer": window.location.href,
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": post ? "POST" : "GET",
            "mode": "cors",
            "credentials": "include"
        });
    
        data = await response.json()
    } catch(err) {
        data = "ERROR";
    }

    return data;
}

async function fillUsers(which) {
    var arr = [];
    var url = "https://i.instagram.com/api/v1/friendships/"+getCookie("ds_user_id")+"/"+which+"/?count=12&search_surface=follow_list_page";
    
    while(true) {
        data = await webReq(url, false);
    
        if (data != null) {
            if (data["page_size"] != null) {
                var max_id = data["next_max_id"];
                url = "https://i.instagram.com/api/v1/friendships/"+getCookie("ds_user_id")+"/"+which+"/?count=12&max_id="+max_id+"&search_surface=follow_list_page";
    
                for (var i = 0; i < data["users"].length; i++)
                    arr.push([data["users"][i].username, data["users"][i].pk]);
    
                if (max_id == null) 
                    break;
    
                if (!data["big_list"])
                    break;
            } else break;
        }
    }

    return arr;
}

async function isCeleb(pk) {
    data = await webReq("https://i.instagram.com/api/v1/users/"+pk+"/info/", false);

    if (data != null) {
        return (data["user"]["follower_count"] > FollowerCount);
    }
}

function create_unfollowers_list(following, followers) {
    var not_following_me = [];

    for (var i = 0; i < following.length; i++) {
        var isFollowingMe = false;
        for (var j = 0; j < followers.length; j++) {
            if (following[i][1] == followers[j][1])
                isFollowingMe = true;
        }

        if (!isFollowingMe)
            not_following_me.push([following[i][0], following[i][1]])
    }

    return not_following_me;
}

var unfollow_req_ctr = 0;
async function unfollow_celeb_wannabes(unfollow_list) {
    for (var i = 0; i < unfollow_list.length; i++) {
        if (unfollow_list[i][2])
            continue;

        var celeb = await isCeleb(unfollow_list[i][1]);

        if (!celeb) {
            data = await webReq("https://www.instagram.com/web/friendships/"+unfollow_list[i][1]+"/unfollow/", true);
            
            if (data == "ERROR") {
                console.log("You've most likely hit a rate limit. We'll try again in 20 minutes.")
                i -= 1;

                await new Promise(r => setTimeout(r, minutesToMilliseconds(20)));

                continue;
            }
            
            console.log("Unfollowed "+unfollow_list[i][0]+i+"/"+unfollow_list.length+" left");
            unfollow_req_ctr += 1;
        }

        if (unfollow_req_ctr == 15) {
            unfollow_req_ctr = 0;
            await new Promise(r => setTimeout(r, minutesToMilliseconds(12)));
        }
    }
    console.log("Ran through the whole list. There's no more wannabe-celebs!");
}

async function main() {
    var followers_arr = await fillUsers("followers");

    await new Promise(r => setTimeout(r, minutesToMilliseconds(4))); 

    var following_arr = await fillUsers("following");

    var not_following_me_arr = create_unfollowers_list(following_arr, followers_arr);

    await unfollow_celeb_wannabes(not_following_me_arr);
}

await main();