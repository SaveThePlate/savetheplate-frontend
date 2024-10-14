export const AuthToast = (
  <div className="flex flex-col gap-2 mx-4 my-2 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg max-w-md">
    <div className="flex gap-3 items-center">
      <div className="bg-green-200 flex justify-center items-center w-9 h-9 rounded-lg">
        <span className="text-green-700 font-bold">✔</span>
      </div>
      <h2 className="font-semibold text-lg text-green-900">
        Check your email
      </h2>
    </div>
    <p className="font-normal text-green-800 text-sm">
      We sent you a login link. Be sure to check your spam too.
    </p>
  </div>
);

export const ErrorToast = (
  <div className="flex flex-col gap-2 mx-4 my-2 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg max-w-md">
    <div className="flex gap-3 items-center">
      <div className="bg-red-200 flex justify-center items-center w-9 h-9 rounded-lg">
        <span className="text-red-700 font-bold">⚠</span>
      </div>
      <h2 className="font-semibold text-lg text-red-900">Error</h2>
    </div>
    <p className="font-normal text-red-800 text-sm">
      There was an error, please try again.
    </p>
  </div>
);
