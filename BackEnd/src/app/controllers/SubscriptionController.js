import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import User from '../models/User';
import File from '../models/File';

import Queue from '../../lib/Queue';
import SubscriptionMail from '../jobs/SubscriptionMail';

class SubscriptionController {
  async index(req, res) {
    const subscription = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      attributes: ['id'],
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          attributes: ['id', 'title', 'description', 'location', 'date'],
          required: true,
          include: [
            {
              model: File,
              as: 'banner',
              attributes: ['id', 'path', 'url'],
            },
            {
              model: User,
              attributes: ['id', 'name', 'email'],
            },
            {
              model: Subscription,
              attributes: ['meetup_id', 'user_id'],
            },
          ],
        },
      ],

      order: [[Meetup, 'date']],
    });
    return res.json(subscription);
  }

  async store(req, res) {
    const user = await User.findByPk(req.userId);

    const { meetupId } = req.params;

    const meetup = await Meetup.findByPk(meetupId, {
      include: [
        {
          model: User,
          attributes: ['name', 'email'],
        },
      ],
      attributes: ['id', 'title', 'description', 'location', 'date'],
    });

    if (!meetup) {
      return res.status(401).json({ error: 'Meetup not found!' });
    }

    if (meetup.user_id === user.id) {
      return res
        .status(401)
        .json({ error: "Can't subscribe for your own meetup" });
    }

    if (meetup.past) {
      return res.status(401).json({ error: "Can't subscribe past meetups" });
    }

    const subscriptionExists = await Subscription.findOne({
      where: {
        user_id: req.userId,
        meetup_id: meetupId,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (subscriptionExists) {
      return res
        .status(401)
        .json({ error: "Can't subscribe for the meetup twice" });
    }

    const subscription = await Subscription.create({
      user_id: user.id,
      meetup_id: meetup.id,
    });

    await Queue.add(SubscriptionMail.key, {
      user,
      meetup,
    });

    return res.json(subscription);
  }

  async delete(req, res) {
    const { meetupId } = req.params;
    console.log(meetupId, req.userId);

    const subscription2 = await Subscription.findOne({
      where: {
        meetup_id: meetupId,
        user_id: req.userId,
      },
      attributes: ['id', 'meetup_id', 'user_id'],
    });

    const data = subscription2.meetup_id;

    console.log('subscription2', data);

    const subscription_delete = await Subscription.findByPk(subscription2.id);

    if (!subscription_delete) {
      return res.status(401).json({ error: 'Subscription not found' });
    }

    await subscription2.destroy();

    return res.send();
  }
}

export default new SubscriptionController();
