import * as Yup from 'yup';
import { Op } from 'sequelize';
import {
  startOfDay,
  isBefore,
  parseISO,
  startOfHour,
  addDays,
  endOfDay,
} from 'date-fns';

import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';

import Subscription from '../models/Subscription';

class MeetupController {
  // async index(req, res) {
  // const meetups = await Meetup.findAll({
  //  where: { user_id: req.userId },
  // });
  // if (req.query.date) {
  //  const searchDate = parseISO(req.query.date);
  //
  // where.date = {
  //  [Op.between]: [starOfDay(searchDate), endOfDay(searchDate)],
  //  canceled_at: null,
  // };
  // }
  async index(req, res) {
    const page = req.query.page || 1;

    const parsedDate = parseISO(req.query.date);

    const searchDate = Number(new Date());
    const searchDate2 = Number(addDays(new Date(), 365));
    // console.log(searchDate1);
    console.log('Data', parsedDate);

    const meetups = await Meetup.findAll({
      // where,
      where: {
        date: {
          [Op.gt]: startOfDay(searchDate),
          [Op.between]: [
            startOfDay(req.query.date ? parsedDate : searchDate),
            endOfDay(req.query.date ? parsedDate : searchDate2),
          ],
        },
      },
      order: ['date'],
      attributes: [
        'past',
        'id',
        'title',
        'description',
        'location',
        'date',
        'file_id',
      ],
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
        },
        {
          model: File,
          as: 'banner',
          attributes: ['name', 'path', 'url'],
        },
        {
          model: Subscription,
          attributes: ['meetup_id', 'user_id'],
        },
      ],

      limit: 10,
      offset: 10 * page - 10,
    });

    const { id_meetup } = req.params;
    console.log(meetups);

    console.log(id_meetup);

    if (id_meetup) {
      const meetups2 = await Meetup.findOne({
        where: { id: id_meetup },
        attributes: [
          'past',
          'id',
          'title',
          'description',
          'location',
          'date',
          'file_id',
        ],
        include: [
          {
            model: File,
            as: 'banner',
            attributes: ['id', 'path', 'url'],
          },
        ],
      });
      const { url } = meetups2.banner;

      console.log(url);

      return res.json(meetups2);
    }

    return res.json(meetups);
  }

  async store(req, res) {
    console.log(req.body);
    const scheme = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      banner_id: Yup.number().required(),
      date: Yup.date().required(),
    });
    if (!(await scheme.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    // check date is not from the past
    const hourStart = startOfHour(parseISO(req.body.date));

    if (isBefore(hourStart, new Date())) {
      return res
        .status(400)
        .json({ error: 'Meetup past date are not permitted' });
    }

    const user_id = req.userId;

    const meetups = await Meetup.findOne({
      where: { user_id: req.userId, title: req.body.title },
    });

    if (meetups) {
      return res
        .status(400)
        .json({ error: 'User cannot subscribe to same meetup twice' });
    }

    const file_id = req.body.banner_id;
    const meetup = await Meetup.create({
      ...req.body,
      user_id,
      file_id,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const scheme = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      banner_id: Yup.number().required(),
      date: Yup.date().required(),
    });
    if (!(await scheme.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    // check date is not from the past
    const hourStart = startOfHour(parseISO(req.body.date));

    if (isBefore(hourStart, new Date())) {
      return res
        .status(400)
        .json({ error: 'Meetup past date are not permitted' });
    }

    const { id_meetup } = req.params;

    if (!Number(id_meetup)) {
      return res.status(400).json({ error: 'Id Meetup found' });
    }

    const meetup = await Meetup.findByPk(id_meetup);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't update past meetups." });
    }

    const file_id = req.body.banner_id;
    meetup.update({
      ...req.body,
      file_id,
    });

    // await meetup.update(req.body);

    await Meetup.findByPk(req.id_meetup, {
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json(meetup);
  }

  async delete(req, res) {
    const { id_meetup } = req.params;

    if (!Number(id_meetup)) {
      return res.status(400).json({ error: 'Id Meetup found' });
    }

    const meetup = await Meetup.findByPk(id_meetup);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't delete past meetups." });
    }
    await meetup.destroy();

    return res.send();
  }
}

export default new MeetupController();
