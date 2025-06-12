const handleFunLoading = async(setIsLoading, method, paramsOfMethod) => {
    // console.log(setIsLoading)
    setIsLoading(true)
    
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
        await method(...paramsOfMethod)
    } catch (error) {
        console.log(error);
    } finally {
        setIsLoading(false)
    }

    // console.log(method)
}

export default handleFunLoading