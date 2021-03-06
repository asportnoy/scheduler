const Discord = require('discord.js');
const dayjs = require('dayjs');

const {
    User
} = require('../../../helpers/mongo');

const {
    domain, port, prefix
} = require('../../../config/config.json');

module.exports.run = async (msg, command, args) => {
    const {
        author,
        channel
    } = msg;

    // Get user from database and create if doesn't exist
    let user = await User.findOne().id(author.id);
    if (!user) {
        user = await new User({
            id: author.id
        }).save();
    }

    // Time format
    const format = user.getFormat().format;

    if (args[0]) {
        let day;
        try {
            day = dayjs().tz(args[0]);
        } catch (e) {
            return channel.send(`<@${author.id}> Invalid timezone`).catch(e => {});
        }
        user.timezone = args[0];
        await user.save();
        return channel.send(`<@${author.id}> Your timezone was set to \`${args[0]}\`. The current time is **${day.format(format)}**.`).catch(e => {});
    }

    if (!domain || !port) return channel.send(`<@${author.id}> Web setup is unavailable. Please specify a time zone to set. Usage: \`${prefix}set [zone]\`.\nFor a list of time zones, please see <https://github.com/asportnoy/scheduler/blob/main/zones.md>.`).catch(e => {});
    // Generate a token for the website
    const token = await user.generateToken('timezone', 60 * 1000 * 10, true);
    if (!token) return channel.send(`<@${author.id}> Could not generate a timezone link for you. Please try again.`).catch(e => {});

    // Generate a URL with params
    const url = `${domain}/timezone?id=${author.id}&code=${token}&format=${encodeURIComponent(format)}`;

    // DM the link to the user
    author.send(new Discord.MessageEmbed({
            author: {
                name: author.tag,
                iconURL: author.displayAvatarURL({
                    dynamic: true
                })
            },
            title: 'Set your timezone',
            description: `Please visit [this link](${url}) and set your time zone with the dropdown or map. Your local time should be automatically selected.\nWhen you're done, click save to update your timezone. **Do not share this link.**`,
            footer: {
                text: 'This link expires at'
            },
            timestamp: dayjs().add(60 * 1000 * 10, 'ms')
        }))
        .then(() => { // Send in channel to check DM
            channel.send(`<@${author.id}> please check your DMs for further instructions.`).catch(e => {})
        })
        .catch((e) => { // Could not DM user
            channel.send(`<@${author.id}> we were unable to DM you the timezone link. Please make sure your DMs are open and try again.`).catch(e => {})
        })
}

module.exports.config = {
    name: 'set',
    aliases: [],
    help: {
        description: 'Set your timezone',
        args: [],
        examples: ['set']
    }
}