export default function LoadingButton() {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <button
        type="button"
        className="
          relative overflow-visible
          inline-flex rounded-full items-center
          bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600
          text-white border-2 border-emerald-300/30
          hover:from-emerald-500 hover:via-teal-500 hover:to-green-500
          hover:border-emerald-200/50 hover:shadow-2xl hover:shadow-emerald-500/30
          focus:ring-4 focus:ring-emerald-300/50 shadow-xl shadow-emerald-600/40
          font-medium leading-5 text-sm px-6 py-4
          transition-all duration-300
          backdrop-blur-sm
        "
      >
        {/* Multiple wave effects */}
        <span
          className="
            absolute inset-0 rounded-full border-2 border-emerald-300
            animate-wave1 opacity-0
          "
          style={{
            animation: "wave 2s ease-out infinite",
          }}
        ></span>

        <span
          className="
            absolute inset-0 rounded-full border-2 border-teal-300
            animate-wave2 opacity-0
          "
          style={{
            animation: "wave 2s ease-out 0.5s infinite",
          }}
        ></span>

        <span
          className="
            absolute inset-0 rounded-full border-2 border-green-300
            animate-wave3 opacity-0
          "
          style={{
            animation: "wave 2s ease-out 1s infinite",
          }}
        ></span>

        <svg
          aria-hidden="true"
          className="w-4 h-4 text-emerald-200 animate-spin fill-white me-2 z-10 drop-shadow-lg"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>

        <span className="z-10 font-semibold tracking-wide drop-shadow-md">
          Loading...
        </span>
      </button>

      <style>{`
        @keyframes wave {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
