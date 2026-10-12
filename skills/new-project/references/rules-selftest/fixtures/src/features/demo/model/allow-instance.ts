// biome-ignore lint/correctness/useExhaustiveDependencies(a): reason here
useEffect(() => { void [a, b] }, [b])
