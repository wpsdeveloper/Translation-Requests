declare namespace google {
  namespace script {
    interface Runner {
      withSuccessHandler(handler: (result: any) => void): Runner;
      withFailureHandler(handler: (error: Error) => void): Runner;

      getDataFromServer(): void;
      addRequestToServer(requestData: any): void;
      saveDataToServer(data: any): void;
      deleteRequestFromServer(recordId: string): void;
      uploadFile(fileBase64: string, fileName: string, mimeType: string): void;

      getUsersData(): void;
      saveUser(userData: any, action: string): void;
    }
    const run: Runner;
  }
}
