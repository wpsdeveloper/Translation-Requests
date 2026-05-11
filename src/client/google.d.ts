declare namespace google {
  namespace script {
    interface Runner {
      withSuccessHandler(handler: (result: any) => void): Runner;
      withFailureHandler(handler: (error: Error) => void): Runner;
      getDataFromServer(): void;
      saveDataToServer(data: any): void;
      getUsersData(): void;
      saveUser(userData: any, action: string): void;
      addRequestToServer(requestData: any): void;
      uploadFile(fileBase64: string, fileName: string, mimeType: string): void;
    }
    const run: Runner;
  }
}
