import File from '../models/File';
/*
Incluir no array: const models = [User, File];
C:\Users\osvaldo\gostack\Meetapp\src\database\index.js
*/
class FileController {
  async store(req, res) {
    const { originalname: name, filename: path } = req.file;
    const file = await File.create({
      name,
      path,
    });
    return res.json(file);
  }
}

export default new FileController();
