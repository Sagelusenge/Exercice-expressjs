// File upload service
class UploadService {
  async uploadFile(file, folder) {
    try {
      // File upload logic
      console.log(`File uploaded: ${file.filename}`);
      return file;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UploadService();
