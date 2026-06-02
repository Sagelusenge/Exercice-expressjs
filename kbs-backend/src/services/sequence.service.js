// Sequence/numbering service
class SequenceService {
  async getNextSequence(type) {
    try {
      // Sequence generation logic
      console.log(`Next sequence for ${type} generated`);
      return 1;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SequenceService();
