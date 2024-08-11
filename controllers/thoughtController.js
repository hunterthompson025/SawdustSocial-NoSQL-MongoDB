const { Thought, User } = require('../models');
const { ObjectId } = require('mongoose').Types;

module.exports = {

    async getThoughts(req, res) {
        try {
            const thoughts = await Thought.aggregate([
                {
                    $addFields: {
                        createdAt: {
                            $dateToString: {
                                format: "%Y-%m-%d %H:%M:%S",
                                date: "$createdAt",
                                timezone: "America/Phoenix",
                            }
                        },
                    }
                }
            ]);
            res.json(thoughts);
        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }
    },

    async getSingleThought(req, res) {
        try {
            const thought = await Thought.aggregate([
                {
                    $match: { _id: new ObjectId(req.params.thoughtId) }
                },
                {
                    $addFields: {
                        createdAt: {
                            $dateToString: {
                                format: "%Y-%m-%d %H:%M:%S",
                                date: "$createdAt",
                                timezone: "America/Phoenix",
                            }
                        }
                    }
                }
            ]);

            if (!thought || thought.length === 0) {
                return res.status(404).json({ message: 'No thought with that ID' });
            }

            res.json(thought[0]);
        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }
    },


    async createThought(req, res) {
        try {
            const thought = await Thought.create(req.body);
            const user = await User.findOneAndUpdate(
                { _id: req.body.userId },
                { $addToSet: { thoughts: thought._id } },
                { new: true }
            );

            if (!user) {
                return res.status(404).json({
                    message: 'Thought created, but no user with that ID found'
                })
            }

            res.json('Created the thought');
        } catch (err) {
            console.log(err);
            return res.status(500).json(err);
        }
    },

    async updateThought(req, res) {
        try {
            const thought = await Thought.findOneAndUpdate(
                { _id: req.params.thoughtId },
                { $set: req.body },
                { runValidators: true, new: true }
            );

            if (!thought) {
                return res.status(404).json({ message: 'No thought with this ID' });
            }

            res.json(thought);
        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }
    },

    async deleteThought(req, res) {
        try {
            const thought = await Thought.findOneAndDelete({ _id: req.params.thoughtId });

            if (!thought) {
                return res.status(404).json({ message: 'No thought with this ID' });
            }

            const user = await User.findOneAndUpdate(
                { thoughts: req.params.thoughtId },
                { $pull: { thoughts: req.params.thoughtId } },
                { new: true }
            );

            if (!user) {
                return res.status(404).json({ message: 'Thought removed but no user with this ID' });
            }

            res.json({ message: 'Thought successfully deleted' });
        } catch (err) {
            res.status(500).json(err);
        }
    },

    async addReaction(req, res) {
        try {
            const thought = await Thought.findOneAndUpdate(
                { _id: req.params.thoughtId },
                { $addToSet: { reactions: req.body } },
                { runValidators: true, new: true }
            );

            if (!thought) {
                return res.status(404).json({ message: 'No thought with this ID' });
            }

            res.json(thought);
        } catch (err) {
            res.status(500).json(err);
        }
    },

    async removeReaction(req, res) {
        try {
            const thought = await Thought.findOneAndUpdate(
                { _id: req.params.thoughtId },
                { $pull: { reactions: { reactionId: req.params.reactionId } } },
                { runValidators: true, new: true }
            );

            if (!thought) {
                return res.status(404).json({ message: 'No thought with this ID' });
            }

            res.json(thought);
        } catch (err) {
            res.status(500).json(err);
        }
    },
};