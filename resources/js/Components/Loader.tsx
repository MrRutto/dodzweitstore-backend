export default function Loader({ isLoading }: {isLoading: boolean}) {
  return (
    <>
      {
        isLoading &&
        <div className="z-10 fixed top-0 left-0 bg-opacity-50 bg-gray-700 h-lvh w-full flex items-center justify-center">
          <span className="loader"></span>
        </div>
      }
    </>
  )
}