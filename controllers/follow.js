const Follower = require("../models/followers")

exports.follow = async (req, res) => {
    const { type, userSlug } = req.body
    const peer = req.params.peer;
    Follower.find({ type: type, following: peer, userSlug: userSlug }, (err, usr) => {
        if (err) {
            return res.status(500).json(err);
        }
        else if (usr.length) {
            return res.status(200).json('success');
        }
        else {
            Follower.create({ type: type, following: peer, userSlug: userSlug }, (er) => {
                if (er) {
                    return res.status(500).json(er);
                }
                else {
                    return res.status(200).json('success');
                }
            })
        }
    })

}
exports.getfollowing = async (req, res) => {
    try {

        const slug = req.params.slug;
        const follow = await Follower.find({ userSlug: slug }, { following: 1, type: 1 });
        return res.status(200).json(follow);
    }
    catch (error) {
        res.status(500).json(error)
    }
}
exports.getfollower = async (req, res) => {
    try {

        const slug = req.params.slug;
        const follow = await Follower.find({ following: slug }, { userSlug: 1, type: 1 });
        return res.status(200).json(follow);

    }
    catch (error) {
        res.status(500).json(error)
    }
}
exports.unfollow = async (req, res) => {
    try {
        const { type, userSlug } = req.body
        const peer = req.params.peer;
        await Follower.findOneAndDelete({ type: type, following: peer, userSlug: userSlug });
        return res.status(200).json('success');
    }
    catch (err) {
        res.status(500).json(err)
    }
}
exports.checkfollowing = async (req, res) => {
    try {

        const slug = req.params.slug;
        const peer = req.params.peer
        let follow = await Follower.find({ userSlug: slug , following:peer}, { following: 1, type: 1 });
         follow = follow.length > 0 ? true : false 
        return res.status(200).json(follow);
    }
    catch (error) {
        res.status(500).json(error)
    }
}
exports.checkfollower = async (req, res) => {
    try {

        const slug = req.params.slug;
        const peer = req.params.peer
        const follow = await Follower.find({ userSlug:peer,following: slug }, { userSlug: 1, type: 1 });
        return res.status(200).json(follow);

    }
    catch (error) {
        res.status(500).json(error)
    }
}