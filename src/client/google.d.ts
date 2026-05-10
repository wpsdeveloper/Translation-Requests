declare namespace google {
  namespace script {
    interface Runner {
      withSuccessHandler(handler: (result: any) => void): Runner;
      withFailureHandler(handler: (error: Error) => void): Runner;
      getDataFromServer(): void;
      saveDataToServer(data: any): void;
      getUsersData(): void;
      saveUser(userData: any, action: string): void;
    }
    const run: Runner;
  }
}
