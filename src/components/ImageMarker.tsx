interface ImageMarkerProps {
  imageUrl: string;
  type: 'threat' | 'ecosystem' | 'habitat' | 'protected' | 'species';
  onClick: () => void;
}

const ImageMarker = ({ imageUrl, type, onClick }: ImageMarkerProps) => {
  return (
    <div 
      className="cursor-pointer hover:scale-110 transition-transform"
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
        <img 
          src={imageUrl} 
          alt={type}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default ImageMarker;