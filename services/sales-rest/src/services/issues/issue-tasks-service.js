class IssueTasksService {
  constructor(issueTasksRepository) {
    this.issueTasksRepository = issueTasksRepository;
  }

  findIssueTasksList() {
    return this.issueTasksRepository.fetchIssueTasksList();
  }

  findIssueTasksForTask(taskObjectID) {
    return this.issueTasksRepository.findIssueTasksForTask(taskObjectID);
  }
}
module.exports = {
  factory: (issueTasksRepository) => new IssueTasksService(issueTasksRepository),
};
