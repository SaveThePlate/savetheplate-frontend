export const AuthToast = (
  <div className="flex flex-col gap-2 mx-4 my-1">
    <div className="flex gap-3 items-center">
      <div className="bg-mauve-300 flex justify-center items-center w-9 h-9 rounded-lg">
      </div>
      <h2 className="font-semibold text-base text-mauve-1200">
        Check your email
      </h2>
    </div>
    <p className="font-normal text-mauve-1100 text-sm">
      We sent you a login link. Be sure to check your spam too.
    </p>
  </div>
);

export const ErrorToast = (
  <div className="flex flex-col gap-2 mx-4 my-1">
    <div className="flex gap-3 items-center">
      <div className="bg-mauve-300 flex justify-center items-center w-9 h-9 rounded-lg">
      </div>
      <h2 className="font-semibold text-base text-mauve-1200">Error</h2>
    </div>
    <p className="font-normal text-mauve-1100 text-sm">
      There was an error, please try again.
    </p>
  </div>
);
